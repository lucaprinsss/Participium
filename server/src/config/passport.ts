import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';
import {userRepository} from '@repositories/userRepository';
import { userEntity } from '@models/entity/userEntity';

/**
 * Interface for the data serialized in the session
 */
interface SessionUser{
 id: number,
 role: string
}

/**
 * Type for the Passport verify callback
 */
type VerifyCallback = (
  error: Error | null,
  user?: userEntity | false,
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
        
        return cb(null, user);
      } catch (err) {
        return cb(err as Error);
      }
    }
  ));

  // Serialize user to session
  passport.serializeUser((user: userEntity, cb: (err: Error | null, id?: SessionUser) => void) => {
    const sessionUser: SessionUser = {
      id: user.id,
      role: user.role
    }

    cb(null, sessionUser);
  });

  // Deserialize user from session
  passport.deserializeUser(async (sessionUser: SessionUser, cb: (err: Error | null, user?: Express.User | false) => void) => {
    try {
      const user = await userRepository.findUserById(sessionUser.id);
      if (!user) {
        return cb(null, false);
      }

      cb(null, user);

    } catch (err) {
      cb(err as Error, false);
    }
  });
}

export default passport;