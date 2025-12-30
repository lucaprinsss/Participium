import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { userRepository } from '@repositories/userRepository';
import { UserEntity } from '@models/entity/userEntity';

// Type for user data serialized in session
// Supporta ruoli multipli (PT10)
interface SessionUser {
  id: number;
  username: string;
  departmentRoleIds?: number[];  // Array of role IDs for multiple roles support
}

export const configurePassport = (): void => {
  // Strategia di autenticazione locale
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'username',
        passwordField: 'password',
      },
      async (username, password, done) => {
        try {
          // Verifica le credenziali usando il metodo del repository
          const user = await userRepository.verifyCredentials(username, password);

          if (!user) {
            return done(null, false, { message: 'Invalid credentials' });
          }

          // Autenticazione riuscita
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Serialize user in session (save only essential data)
  passport.serializeUser((user: Express.User, done) => {
    // Esegui un cast al tuo tipo specifico userEntity
    const u = user as UserEntity;
    // Supports multiple roles - extracts all departmentRoleIds
    const departmentRoleIds = u.userRoles?.map(ur => ur.departmentRoleId) || [];
    const sessionUser: SessionUser = {
      id: u.id,
      username: u.username,
      departmentRoleIds: departmentRoleIds,
    };
    done(null, sessionUser);
  });

  // Deserialize user from session
  passport.deserializeUser(async (sessionUser: SessionUser, done) => {
    try {
      // Find the complete user from repository using the ID
      const user = await userRepository.findUserById(sessionUser.id);
      if (!user) {
        return done(new Error('User not found'));
      }
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};

export { default } from 'passport';