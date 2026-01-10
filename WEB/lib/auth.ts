import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export const authOptions: NextAuthOptions = {
  providers: [
    // Credentials Provider (Email/Password via FastAPI)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('🔍 Authorize called with:', { email: credentials?.email });

        if (!credentials?.email || !credentials?.password) {
          console.error('❌ Missing credentials');
          return null;
        }

        try {
          console.log('📡 Calling API:', `${API_URL}/users/login`);
          
          const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          console.log('📊 API Response status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API returned error:', response.status, errorText);
            return null;
          }

          const data = await response.json();
          console.log('✅ Login successful for user:', data.user.email);

          // Return user with access token
          return {
            id: data.user.id.toString(),
            email: data.user.email,
            name: `${data.user.first_name} ${data.user.last_name}`,
            firstName: data.user.first_name,
            lastName: data.user.last_name,
            accessToken: data.access_token,
          };
        } catch (error) {
          console.error('❌ Authentication error:', error);
          return null;
        }
      },
    }),

    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),

    // GitHub OAuth Provider
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
  ],

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    async jwt({ token, user }) {
      // Add user data and access token on sign in
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.accessToken = user.accessToken;
      }
      return token;
    },

    async session({ session, token }) {
      // Add user data and access token to session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};
