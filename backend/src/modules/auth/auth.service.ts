import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Pool } from 'pg';
import { env } from '../../config/env';
import { AuthUserContext, JwtPayload, RoleType } from '../../types/auth';

const pool = new Pool({
  connectionString: env.databaseUrl,
});

type LoginResult = {
  token: string;
  user: {
    id: string;
    email: string;
    role: RoleType;
    doctorProfileId?: string;
    pharmacyProfileId?: string;
    patientProfileId?: string;
  };
};

export class AuthService {
  static async login(email: string, password: string): Promise<LoginResult> {
    const userResult = await pool.query(
      `
      SELECT id, email, password_hash, role, is_active
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [email.toLowerCase().trim()]
    );

    const user = userResult.rows[0];
    if (!user || !user.is_active) {
      throw new Error('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      throw new Error('Invalid credentials');
    }

    let doctorProfileId: string | undefined;
    let pharmacyProfileId: string | undefined;
    let patientProfileId: string | undefined;

    if (user.role === 'doctor') {
      const profile = await pool.query(
        `SELECT id FROM doctors WHERE user_id = $1 LIMIT 1`,
        [user.id]
      );
      doctorProfileId = profile.rows[0]?.id;
      if (!doctorProfileId) {
        throw new Error('Doctor profile missing');
      }
    }

    if (user.role === 'pharmacy') {
      const profile = await pool.query(
        `SELECT id FROM pharmacies WHERE user_id = $1 LIMIT 1`,
        [user.id]
      );
      pharmacyProfileId = profile.rows[0]?.id;
      if (!pharmacyProfileId) {
        throw new Error('Pharmacy profile missing');
      }
    }

    if (user.role === 'patient') {
      const profile = await pool.query(
        `SELECT id FROM patients WHERE user_id = $1 LIMIT 1`,
        [user.id]
      );
      patientProfileId = profile.rows[0]?.id;
      if (!patientProfileId) {
        throw new Error('Patient profile missing');
      }
    }

    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
    };

    const signOptions: SignOptions = {
      expiresIn: env.jwtExpiresIn as any,
    };

    const token = jwt.sign(payload, env.jwtSecret, signOptions);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        doctorProfileId,
        pharmacyProfileId,
        patientProfileId,
      },
    };
  }

  static async getAuthContextFromUserId(userId: string): Promise<AuthUserContext | null> {
    const userResult = await pool.query(
      `
      SELECT id, email, role, is_active
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [userId]
    );

    const user = userResult.rows[0];
    if (!user || !user.is_active) {
      return null;
    }

    let doctorProfileId: string | undefined;
    let pharmacyProfileId: string | undefined;
    let patientProfileId: string | undefined;

    if (user.role === 'doctor') {
      const profile = await pool.query(
        `SELECT id FROM doctors WHERE user_id = $1 LIMIT 1`,
        [user.id]
      );
      doctorProfileId = profile.rows[0]?.id;
    }

    if (user.role === 'pharmacy') {
      const profile = await pool.query(
        `SELECT id FROM pharmacies WHERE user_id = $1 LIMIT 1`,
        [user.id]
      );
      pharmacyProfileId = profile.rows[0]?.id;
    }

    if (user.role === 'patient') {
      const profile = await pool.query(
        `SELECT id FROM patients WHERE user_id = $1 LIMIT 1`,
        [user.id]
      );
      patientProfileId = profile.rows[0]?.id;
    }

    return {
      userId: user.id,
      role: user.role as RoleType,
      doctorProfileId,
      pharmacyProfileId,
      patientProfileId,
    };
  }
}
