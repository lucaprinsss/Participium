"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurePassport = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const userRepository_1 = require("@repositories/userRepository");
const configurePassport = () => {
    // Strategia di autenticazione locale
    passport_1.default.use(new passport_local_1.Strategy({
        usernameField: 'username',
        passwordField: 'password',
    }, async (username, password, done) => {
        try {
            // Verifica le credenziali usando il metodo del repository
            const user = await userRepository_1.userRepository.verifyCredentials(username, password);
            if (!user) {
                return done(null, false, { message: 'Invalid credentials' });
            }
            // Autenticazione riuscita
            return done(null, user);
        }
        catch (error) {
            return done(error);
        }
    }));
    // Serializza l'utente in sessione (salva solo i dati essenziali)
    passport_1.default.serializeUser((user, done) => {
        // Esegui un cast al tuo tipo specifico userEntity
        const u = user;
        const sessionUser = {
            id: u.id,
            username: u.username,
            departmentRoleId: u.departmentRoleId,
        };
        done(null, sessionUser);
    });
    // Deserializza l'utente dalla sessione
    passport_1.default.deserializeUser(async (sessionUser, done) => {
        try {
            // Trova l'utente completo dal repository usando l'ID
            const user = await userRepository_1.userRepository.findUserById(sessionUser.id);
            if (!user) {
                return done(new Error('User not found'));
            }
            done(null, user);
        }
        catch (error) {
            done(error);
        }
    });
};
exports.configurePassport = configurePassport;
exports.default = passport_1.default;
