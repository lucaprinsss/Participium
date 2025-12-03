import { UserResponse } from '@models/dto/output/UserResponse';
import { RegisterRequest } from '@models/dto/input/RegisterRequest';
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { NotFoundError } from '@models/errors/NotFoundError';
import { BadRequestError } from '@models/errors/BadRequestError';
import { logInfo } from '@services/loggingService';
import { mapUserEntityToUserResponse } from '@services/mapperService';
import { ConflictError } from '@models/errors/ConflictError';
import { AppError } from '@models/errors/AppError'; 

/**
 * Service for municipality user management
 */
class MunicipalityUserService {

  /**
   * Create a new municipality user
   * @param registerData User registration data
   * @returns The created user response
   * @throws BadRequestError if trying to create Citizen or Administrator
   * @throws ConflictError if username or email already exists
   */
  async createMunicipalityUser(registerData: RegisterRequest): Promise<UserResponse> {
    const { role_name, password, first_name, last_name, username, email, department_name } = registerData;

    if (role_name === 'Citizen') {
      throw new BadRequestError('Cannot create a municipality user with Citizen role');
    }
    if (role_name === 'Administrator') {
      throw new BadRequestError('Cannot create an Administrator through this endpoint');
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

    // Find department role by department and role name
    let matchingDepartmentRole;
    if (department_name) {
      matchingDepartmentRole = await departmentRoleRepository.findByDepartmentAndRole(department_name, role_name);
    } else {
      // Find all department roles that match the requested role
      const allDepartmentRoles = await departmentRoleRepository.findAll();
      matchingDepartmentRole = allDepartmentRoles.find(
        dr => dr.role?.name === role_name
      );
    }

    if (!matchingDepartmentRole) {
      throw new BadRequestError(`Role ${role_name} not found in any department`);
    }

    // Create user with repository (it will hash the password)
    const newUser = await userRepository.createUserWithPassword({
      username,
      email,
      firstName: first_name,
      lastName: last_name,
      departmentRoleId: matchingDepartmentRole.id,
      password,
      isVerified: true  // Municipality users are pre-verified
    });
    logInfo(`Municipality user created: ${username} with role ${role_name}`);

    const userResponse = mapUserEntityToUserResponse(newUser);
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
    
    logInfo(`Retrieved ${users.length} municipality users`);
    return users
      .map(user => mapUserEntityToUserResponse(user))
      .filter(user => user !== null);
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

    const roleName = user.departmentRole?.role?.name;
    if (roleName === 'Citizen' || roleName === 'Administrator') {
      throw new NotFoundError('Municipality user not found');
    }
    const userResponse = mapUserEntityToUserResponse(user);
    if (!userResponse) {
      throw new AppError('Failed to map user response for getById', 500);
    }
    return userResponse;
  }

  /**
   * Validate update data has at least one field
   */
  private validateUpdateData(updateData: Partial<{ first_name: string; last_name: string; email: string; role_name: string; department_name?: string }>): void {
    const { first_name, last_name, email, role_name, department_name } = updateData;
    if (!first_name && !last_name && !email && !role_name && !department_name) {
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
   * Resolve department role ID for role update
   */
  private async resolveDepartmentRoleId(role_name: string | undefined, department_name?: string): Promise<number | undefined> {
    if (!role_name) {
      return undefined;
    }

    if (role_name === 'Citizen' || role_name === 'Administrator') {
      throw new BadRequestError('Cannot change role to Citizen or Administrator');
    }

    let matchingDepartmentRole;
    if (department_name) {
      matchingDepartmentRole = await departmentRoleRepository.findByDepartmentAndRole(department_name, role_name);
    } else {
      const allDepartmentRoles = await departmentRoleRepository.findAll();
      matchingDepartmentRole = allDepartmentRoles.find(dr => dr.role?.name === role_name);
    }

    if (!matchingDepartmentRole) {
      throw new BadRequestError(`Role ${role_name} not found in any department`);
    }

    return matchingDepartmentRole.id;
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
    updateData: Partial<{ first_name: string; last_name: string; email: string; role_name: string; department_name?: string }>
  ): Promise<UserResponse> {
    this.validateUpdateData(updateData);

    const existingUser = await userRepository.findUserById(id);
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    const existingRoleName = existingUser.departmentRole?.role?.name;
    if (existingRoleName === 'Citizen' || existingRoleName === 'Administrator') {
      throw new BadRequestError('Cannot modify Citizen or Administrator through this endpoint');
    }

    await this.validateEmailUpdate(updateData.email, existingUser.email);
    
    const departmentRoleId = await this.resolveDepartmentRoleId(updateData.role_name, updateData.department_name);

    const updatedUser = await userRepository.updateUser(id, {
      firstName: updateData.first_name,
      lastName: updateData.last_name,
      email: updateData.email,
      ...(departmentRoleId && { departmentRoleId })
    });

    logInfo(`Municipality user updated: ${updatedUser.username} (ID: ${id})`);

    const userResponse = mapUserEntityToUserResponse(updatedUser);
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

    const roleName = existingUser.departmentRole?.role?.name;
    if (roleName === 'Citizen' || roleName === 'Administrator') {
      throw new BadRequestError('Cannot delete Citizen or Administrator through this endpoint');
    }

    await userRepository.deleteUser(id);

    logInfo(`Municipality user deleted: ${existingUser.username} (ID: ${id})`);
  }

  /**
   * Assign role to municipality user
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

    const existingRoleName = user.departmentRole?.role?.name;
    if (existingRoleName === 'Citizen' || existingRoleName === 'Administrator') {
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

    const updatedUser = await userRepository.updateUser(userId, { 
      departmentRoleId: matchingDepartmentRole.id 
    });

    logInfo(`Role assigned to user ${user.username}: ${roleName} (ID: ${userId})`);

    const userResponse = mapUserEntityToUserResponse(updatedUser);
    if (!userResponse) {
      throw new AppError('Failed to map user response after role assignment', 500);
    }
    return userResponse;
  }

}

export const municipalityUserService = new MunicipalityUserService();