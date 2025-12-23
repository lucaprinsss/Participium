import { UserResponse } from '@models/dto/output/UserResponse';
import { RegisterRequest } from '@models/dto/input/RegisterRequest';
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { companyRepository } from '@repositories/companyRepository';
import { NotFoundError } from '@models/errors/NotFoundError';
import { BadRequestError } from '@models/errors/BadRequestError';
import { logInfo } from '@services/loggingService';
import { mapUserEntityToUserResponse } from '@services/mapperService';
import { ConflictError } from '@models/errors/ConflictError';
import { AppError } from '@models/errors/AppError';
import { RoleUtils } from '@utils/roleUtils';
import { UserRoleEntity } from '@models/entity/userRoleEntity';
import { AppDataSource } from '@database/connection';

/**
 * Service for municipality user management
 */
class MunicipalityUserService {

  /**
   * Helper: Load multiple department roles by IDs
   * @param ids Array of department role IDs
   * @returns Array of department role entities
   */
  private async loadDepartmentRoles(ids: number[]): Promise<any[]> {
    const departmentRoles = await Promise.all(
      ids.map(id => departmentRoleRepository.findById(id))
    );
    return departmentRoles.filter((dr): dr is NonNullable<typeof dr> => dr !== null);
  }

  /**
   * Create a new municipality user
   * @param registerData User registration data
   * @returns The created user response
   * @throws BadRequestError if trying to create Citizen or Administrator or if no roles provided
   * @throws ConflictError if username or email already exists
   */
  async createMunicipalityUser(registerData: RegisterRequest): Promise<UserResponse> {
    const { department_role_ids, password, first_name, last_name, username, email, company_name } = registerData;

    // Validate that at least one role is provided
    if (!department_role_ids || department_role_ids.length === 0) {
      throw new BadRequestError('At least one department role must be provided');
    }

    // Check for duplicate username
    const existingUserByUsername = await userRepository.existsUserByUsername(username);
    if (existingUserByUsername) {
      throw new ConflictError('Username already exists');
    }

    // Check for duplicate email
    const existingUserByEmail = await userRepository.existsUserByEmail(email);
    if (existingUserByEmail) {
      throw new ConflictError('Email already exists');
    }

    // Validate all department_role_ids exist and load them
    const departmentRoles = await this.loadDepartmentRoles(department_role_ids);
    if (departmentRoles.length !== department_role_ids.length) {
      throw new BadRequestError('One or more invalid department role IDs provided');
    }

    // Check that none of the roles are Citizen or Administrator
    for (const dr of departmentRoles) {
      if (dr.role?.name === 'Citizen') {
        throw new BadRequestError('Cannot create a municipality user with Citizen role');
      }
      if (dr.role?.name === 'Administrator') {
        throw new BadRequestError('Cannot create an Administrator through this endpoint');
      }
    }

    // Extract role names for validation
    const roleNames = departmentRoles.map((dr: any) => dr.role?.name).filter(Boolean) as string[];
    const hasExternalMaintainer = roleNames.includes('External Maintainer');

    // Validate company assignment - only External Maintainer can have a company
    if (company_name && !hasExternalMaintainer) {
      throw new BadRequestError('Only External Maintainer role can be assigned to a company');
    }

    // Require company for External Maintainer
    if (hasExternalMaintainer && !company_name) {
      throw new BadRequestError('External Maintainer role requires a company assignment');
    }

    // Resolve company_name to company_id if provided
    let companyId: number | undefined;
    if (company_name) {
      const company = await companyRepository.findByName(company_name);
      if (!company) {
        throw new NotFoundError(`Company "${company_name}" not found`);
      }
      companyId = company.id;
    }

    // Create user with repository (it will hash the password)
    const newUser = await userRepository.createUserWithPassword({
      username,
      email,
      firstName: first_name,
      lastName: last_name,
      password,
      companyId: companyId,
      isVerified: true  // Municipality users are pre-verified
    });

    // Create user_roles entries manually via raw query or service
    // TypeORM doesn't support direct cascade insert for many-to-many without save on parent
    const userRoles = departmentRoles.map((dr: any) => ({
      userId: newUser.id,
      departmentRoleId: dr.id
    }));

    // Insert user roles using query builder
    if (userRoles.length > 0) {
      await AppDataSource.createQueryBuilder()
        .insert()
        .into('user_roles')
        .values(userRoles)
        .execute();
    }

    // Reload user with relations
    const savedUser = await userRepository.findUserById(newUser.id);
    if (!savedUser) {
      throw new AppError('Failed to reload user after creation', 500);
    }

    logInfo(`Municipality user created: ${username} with ${department_role_ids.length} role(s)`);

    // Get company name if user has a company
    let companyName: string | undefined;
    if (savedUser.companyId) {
      const company = await companyRepository.findById(savedUser.companyId);
      companyName = company?.name;
    }

    const userResponse = mapUserEntityToUserResponse(savedUser, companyName);
    if (!userResponse) {
      throw new AppError('Failed to map user response after creation', 500);
    }
    return userResponse;
  }

  /**
   * Get all municipality users
   * @returns Array of user responses (excludes Citizen and Administrator)
   */
  async getAllMunicipalityUsers(): Promise<UserResponse[]> {
    const users = await userRepository.findUsersExcludingRoles(['Citizen', 'Administrator']);

    // Map users to response DTOs, getting company names for those who have companies
    const userResponses = await Promise.all(
      users.map(async user => {
        let companyName: string | undefined;
        if (user.companyId) {
          const company = await companyRepository.findById(user.companyId);
          companyName = company?.name;
        }
        return mapUserEntityToUserResponse(user, companyName);
      })
    );

    logInfo(`Retrieved ${users.length} municipality users`);
    return userResponses.filter((user): user is UserResponse => user !== null);
  }

  /**
   * Get municipality user by ID
   * @param id User ID
   * @returns User response
   * @throws NotFoundError if user not found or is not a municipality user
   */
  async getMunicipalityUserById(id: number): Promise<UserResponse> {
    const user = await userRepository.findUserById(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user has only Citizen or Administrator roles (exclude from municipality users)
    const roleNames = RoleUtils.getUserRoleNames(user);
    const onlyCitizenOrAdmin = roleNames.length > 0 &&
      roleNames.every(name => name === 'Citizen' || name === 'Administrator');

    if (onlyCitizenOrAdmin || roleNames.length === 0) {
      throw new NotFoundError('Municipality user not found');
    }

    // Get company name if user has a company
    let companyName: string | undefined;
    if (user.companyId) {
      const company = await companyRepository.findById(user.companyId);
      companyName = company?.name;
    }

    const userResponse = mapUserEntityToUserResponse(user, companyName);
    if (!userResponse) {
      throw new AppError('Failed to map user response for getById', 500);
    }
    return userResponse;
  }

  /**
   * Validate update data has at least one field
   */
  private validateUpdateData(updateData: Partial<{ first_name: string; last_name: string; email: string; department_role_ids: number[]; company_name?: string }>): void {
    const { first_name, last_name, email, department_role_ids, company_name } = updateData;
    if (!first_name && !last_name && !email && !department_role_ids && !company_name) {
      throw new BadRequestError('At least one field must be provided for update');
    }
  }

  /**
   * Validate email uniqueness if changed
   */
  private async validateEmailUpdate(email: string | undefined, existingEmail: string): Promise<void> {
    if (email && email !== existingEmail) {
      const emailExists = await userRepository.existsUserByEmail(email);
      if (emailExists) {
        throw new ConflictError('Email already exists');
      }
    }
  }

  /**
   * Update municipality user
   * @param id User ID
   * @param updateData Data to update (accepts snake_case from API)
   * @returns Updated user response
   * @throws NotFoundError if user not found
   * @throws BadRequestError if trying to update non-municipality user or no fields provided
   */
  async updateMunicipalityUser(
    id: number,
    updateData: Partial<{ first_name: string; last_name: string; email: string; department_role_ids: number[]; company_name?: string }>
  ): Promise<UserResponse> {
    this.validateUpdateData(updateData);

    const existingUser = await userRepository.findUserById(id);
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Check if user has only Citizen or Administrator roles
    const existingRoleNames = RoleUtils.getUserRoleNames(existingUser);
    const onlyCitizenOrAdmin = existingRoleNames.length > 0 &&
      existingRoleNames.every(name => name === 'Citizen' || name === 'Administrator');

    if (onlyCitizenOrAdmin) {
      throw new BadRequestError('Cannot modify Citizen or Administrator through this endpoint');
    }

    await this.validateEmailUpdate(updateData.email, existingUser.email);

    // Handle department_role_ids update
    let newRoleNames: string[] = existingRoleNames;
    if (updateData.department_role_ids) {
      // Validate all department_role_ids exist and load them
      const departmentRoles = await this.loadDepartmentRoles(updateData.department_role_ids);
      if (departmentRoles.length !== updateData.department_role_ids.length) {
        throw new BadRequestError('One or more invalid department role IDs provided');
      }

      // Check that none of the new roles are Citizen or Administrator
      for (const dr of departmentRoles) {
        if (dr.role?.name === 'Citizen' || dr.role?.name === 'Administrator') {
          throw new BadRequestError('Cannot assign Citizen or Administrator role through this endpoint');
        }
      }

      newRoleNames = departmentRoles.map((dr: any) => dr.role?.name).filter(Boolean) as string[];

      // Delete old user_roles and insert new ones
      await AppDataSource.createQueryBuilder()
        .delete()
        .from('user_roles')
        .where('user_id = :userId', { userId: id })
        .execute();

      const userRoles = departmentRoles.map((dr: any) => ({
        userId: id,
        departmentRoleId: dr.id
      }));

      if (userRoles.length > 0) {
        await AppDataSource.createQueryBuilder()
          .insert()
          .into('user_roles')
          .values(userRoles)
          .execute();
      }
    }

    // Determine if user has External Maintainer role (either existing or new)
    const hasExternalMaintainer = newRoleNames.includes('External Maintainer');

    // Validate company assignment - only External Maintainer can have a company
    if (updateData.company_name && !hasExternalMaintainer) {
      throw new BadRequestError('Only External Maintainer role can be assigned to a company');
    }

    // Resolve company_name to company_id if provided
    let companyId: number | undefined;
    let shouldRemoveCompany = false;

    if (updateData.company_name !== undefined) {
      if (updateData.company_name === null) {
        // Validate: External Maintainer cannot remove company
        if (hasExternalMaintainer) {
          throw new BadRequestError('External Maintainer role requires a company');
        }
        shouldRemoveCompany = true; // Mark for removal
      } else {
        const company = await companyRepository.findByName(updateData.company_name);
        if (!company) {
          throw new NotFoundError(`Company "${updateData.company_name}" not found`);
        }
        companyId = company.id;
      }
    }

    const updatePayload: any = {
      firstName: updateData.first_name,
      lastName: updateData.last_name,
      email: updateData.email
    };

    // Note: user_roles are already updated above via raw query if department_role_ids was provided

    // Add companyId to update payload if it was specified in the request
    if (companyId !== undefined) {
      updatePayload.companyId = companyId;
    }

    // If we need to remove the company, use repository method
    if (shouldRemoveCompany) {
      await userRepository.removeCompanyFromUser(id);
    }

    const updatedUser = await userRepository.updateUser(id, updatePayload);

    logInfo(`Municipality user updated: ${updatedUser.username} (ID: ${id})`);

    // Get company name if user has a company
    let companyName: string | undefined;
    if (updatedUser.companyId) {
      const company = await companyRepository.findById(updatedUser.companyId);
      companyName = company?.name;
    }

    const userResponse = mapUserEntityToUserResponse(updatedUser, companyName);
    if (!userResponse) {
      throw new AppError('Failed to map user response after update', 500);
    }
    return userResponse;
  }

  /**
   * Delete municipality user
   * @param id User ID
   * @returns void
   * @throws NotFoundError if user not found
   * @throws BadRequestError if trying to delete non-municipality user
   */
  async deleteMunicipalityUser(id: number): Promise<void> {
    const existingUser = await userRepository.findUserById(id);

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Check if user has only Citizen or Administrator roles
    const roleNames = RoleUtils.getUserRoleNames(existingUser);
    const onlyCitizenOrAdmin = roleNames.length > 0 &&
      roleNames.every(name => name === 'Citizen' || name === 'Administrator');

    if (onlyCitizenOrAdmin) {
      throw new BadRequestError('Cannot delete Citizen or Administrator through this endpoint');
    }

    await userRepository.deleteUser(id);

    logInfo(`Municipality user deleted: ${existingUser.username} (ID: ${id})`);
  }

  /**
   * Assign role to municipality user
   * @deprecated Use updateMunicipalityUser with department_role_ids instead for multiple role support
   * @param userId User ID
   * @param roleName Role name to assign
   * @param departmentName Optional department name
   * @returns Updated user response
   * @throws NotFoundError if user not found
   * @throws BadRequestError if trying to assign invalid roles
   */
  async assignRole(userId: number, roleName: string, departmentName?: string): Promise<UserResponse> {
    if (roleName === 'Citizen') {
      throw new BadRequestError('Cannot assign Citizen role to municipality user');
    }
    if (roleName === 'Administrator') {
      throw new BadRequestError('Cannot assign Administrator role through this endpoint');
    }

    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const existingRoleNames = RoleUtils.getUserRoleNames(user);
    const onlyCitizenOrAdmin = existingRoleNames.length > 0 &&
      existingRoleNames.every(name => name === 'Citizen' || name === 'Administrator');

    if (onlyCitizenOrAdmin) {
      throw new BadRequestError('Cannot assign role to Citizen or Administrator through this endpoint');
    }

    // Find the department role for the new role
    let matchingDepartmentRole;
    if (departmentName) {
      matchingDepartmentRole = await departmentRoleRepository.findByDepartmentAndRole(departmentName, roleName);
    } else {
      const allDepartmentRoles = await departmentRoleRepository.findAll();
      matchingDepartmentRole = allDepartmentRoles.find(
        dr => dr.role?.name === roleName
      );
    }

    if (!matchingDepartmentRole) {
      throw new BadRequestError(`Role ${roleName} not found in any department`);
    }

    // Add the new role to existing roles (don't replace)
    const existingRoleIds = user.userRoles?.map(ur => ur.departmentRoleId) || [];

    // Check if role already assigned
    if (existingRoleIds.includes(matchingDepartmentRole.id)) {
      logInfo(`Role ${roleName} already assigned to user ${user.username} (ID: ${userId})`);

      // Get company name if user has a company
      let companyName: string | undefined;
      if (user.companyId) {
        const company = await companyRepository.findById(user.companyId);
        companyName = company?.name;
      }

      const userResponse = mapUserEntityToUserResponse(user, companyName);
      if (!userResponse) {
        throw new AppError('Failed to map user response', 500);
      }
      return userResponse;
    }

    // Add new role to existing ones
    await AppDataSource.createQueryBuilder()
      .insert()
      .into('user_roles')
      .values({
        userId: userId,
        departmentRoleId: matchingDepartmentRole.id
      })
      .execute();

    // Reload user to get updated roles
    const updatedUser = await userRepository.findUserById(userId);
    if (!updatedUser) {
      throw new NotFoundError('User not found after role assignment');
    }

    logInfo(`Role assigned to user ${user.username}: ${roleName} (ID: ${userId})`);

    // Get company name if user has a company
    let companyName: string | undefined;
    if (updatedUser.companyId) {
      const company = await companyRepository.findById(updatedUser.companyId);
      companyName = company?.name;
    }

    const userResponse = mapUserEntityToUserResponse(updatedUser, companyName);
    if (!userResponse) {
      throw new AppError('Failed to map user response after role assignment', 500);
    }
    return userResponse;
  }

  /**
   * Remove a single role from municipality user
   * @param userId User ID
   * @param departmentRoleId Department role ID to remove
   * @returns Updated user response
   * @throws NotFoundError if user or role not found
   * @throws BadRequestError if trying to remove last role or modify Citizen/Administrator
   */
  async removeRole(userId: number, departmentRoleId: number): Promise<UserResponse> {
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user has only Citizen or Administrator roles
    const existingRoleNames = RoleUtils.getUserRoleNames(user);
    const onlyCitizenOrAdmin = existingRoleNames.length > 0 &&
      existingRoleNames.every(name => name === 'Citizen' || name === 'Administrator');

    if (onlyCitizenOrAdmin) {
      throw new BadRequestError('Cannot modify Citizen or Administrator through this endpoint');
    }

    // Check if the user has this specific departmentRoleId
    const existingUserRoles = user.userRoles || [];
    const roleToRemove = existingUserRoles.find(ur => ur.departmentRoleId === departmentRoleId);

    if (!roleToRemove) {
      throw new NotFoundError('Role not assigned to this user');
    }

    // Ensure user keeps at least one role
    if (existingUserRoles.length <= 1) {
      throw new BadRequestError('Cannot remove the last role from a municipality user. Users must have at least one role.');
    }

    // Delete the specific user_role entry
    await AppDataSource.createQueryBuilder()
      .delete()
      .from('user_roles')
      .where('user_id = :userId AND department_role_id = :departmentRoleId', {
        userId,
        departmentRoleId
      })
      .execute();

    // Reload user with updated roles
    const updatedUser = await userRepository.findUserById(userId);
    if (!updatedUser) {
      throw new AppError('Failed to reload user after role removal', 500);
    }

    logInfo(`Role removed from user ${user.username}: departmentRoleId ${departmentRoleId} (User ID: ${userId})`);

    // Get company name if user has a company
    let companyName: string | undefined;
    if (updatedUser.companyId) {
      const company = await companyRepository.findById(updatedUser.companyId);
      companyName = company?.name;
    }

    const userResponse = mapUserEntityToUserResponse(updatedUser, companyName);
    if (!userResponse) {
      throw new AppError('Failed to map user response after role removal', 500);
    }
    return userResponse;
  }

}

export const municipalityUserService = new MunicipalityUserService();