import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';
import {userRepository} from '@repositories/citizenRepository';
import { User } from '@models/dto/User';

/**
 * Interfaccia per i dati serializzati nella sessione
 */
interface SessionUser{
 id: number,
 role: string
}

/**
 * Tipo per la callback di verifica di Passport
 */
type VerifyCallback = (
  error: Error | null,
  user?: User | false,
  options?: { message: string }
) => void;

/**
 * Configures Passport authentication
 */
export function configurePassport() {
  // Local strategy for username/password authentication
  passport.use(new LocalStrategy(
    { usernameField: 'username' },
    async function verify(username: string, password: string, cb: VerifyCallback): Promise<void> {
      try {
        const user = await userRepository.verifyCredentials(username, password);
        if (!user) {
          return cb(null, false, { message: 'Invalid username or password' });
        }
        return cb(null, user as User);
      } catch (err) {
        return cb(err as Error);
      }
    }
  ));

//   Serialize user to session
  passport.serializeUser((user: User, cb: (err: Error | null, id?: SessionUser) => void) => {
    
    const sessionUser: SessionUser = {
      id: (user as any).id,
      role: (user as any).role
    }

    cb(null, sessionUser);
  });

//   Deserialize user from session
  passport.deserializeUser(async (sessionUser: SessionUser, cb: (err: Error | null, user?: User | false) => void) => {
    try {
      const user = await userRepository.findCitizenById(sessionUser.id);
      if (!user) {
        return cb(null, false);
      }
      
      const fullUser = {
        ...user, 
        role: sessionUser.role
      } as User;

      cb(null, fullUser);

    } catch (err) {
      cb(err as Error, false);
    }
  });
}

export default passport;