import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { userRepository } from '@repositories/userRepository';
import { UserEntity } from '@models/entity/userEntity';

// Tipo per i dati dell'utente serializzati in sessione
interface SessionUser {
  id: number;
  username: string;
  departmentRoleId?: number;
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

  // Serializza l'utente in sessione (salva solo i dati essenziali)
  passport.serializeUser((user: Express.User, done) => {
    // Esegui un cast al tuo tipo specifico userEntity
    const u = user as UserEntity;
    const sessionUser: SessionUser = {
      id: u.id,
      username: u.username,
      departmentRoleId: u.departmentRoleId,
    };
    done(null, sessionUser);
  });

  // Deserializza l'utente dalla sessione
  passport.deserializeUser(async (sessionUser: SessionUser, done) => {
    try {
      // Trova l'utente completo dal repository usando l'ID
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

export {default} from 'passport';