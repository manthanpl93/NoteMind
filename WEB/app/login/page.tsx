'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Brain, Mail, Lock, Github, User, Loader2 } from 'lucide-react'
import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useFormik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { userApi } from '@/lib/api'

// Form value types
interface LoginValues {
  email: string
  password: string
  rememberMe: boolean
}

interface SignupValues {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  terms: boolean
}

// Validation schemas
const loginSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
})

const signupSchema = Yup.object({
  firstName: Yup.string()
    .min(1, 'First name is required')
    .required('First name is required'),
  lastName: Yup.string()
    .min(1, 'Last name is required')
    .required('Last name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  terms: Yup.boolean()
    .oneOf([true], 'You must accept the terms and conditions')
    .required(),
})

function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  // Login form with Formik
  const loginForm = useFormik({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    validationSchema: loginSchema,
    onSubmit: async (values: LoginValues, { setSubmitting }: FormikHelpers<LoginValues>) => {
      setApiError(null)
      try {
        const result = await signIn('credentials', {
          email: values.email,
          password: values.password,
          redirect: false,
        })

        if (result?.error) {
          setApiError(result.error)
        } else {
          router.push(callbackUrl)
          router.refresh()
        }
      } catch {
        setApiError('An error occurred during login')
      } finally {
        setSubmitting(false)
      }
    },
  })

  // Signup form with Formik
  const signupForm = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
    validationSchema: signupSchema,
    onSubmit: async (values: SignupValues, { setSubmitting }: FormikHelpers<SignupValues>) => {
      setApiError(null)
      try {
        // Create account via API
        await userApi.signup({
          email: values.email,
          password: values.password,
          first_name: values.firstName,
          last_name: values.lastName,
        })

        // Sign in with new credentials
        const result = await signIn('credentials', {
          email: values.email,
          password: values.password,
          redirect: false,
        })

        if (result?.error) {
          setApiError(result.error)
        } else {
          router.push(callbackUrl)
          router.refresh()
        }
      } catch (err) {
        const error = err as { message?: string }
        setApiError(error.message || 'An error occurred during signup')
      } finally {
        setSubmitting(false)
      }
    },
  })

  const handleSocialLogin = (provider: 'google' | 'github') => {
    signIn(provider, { callbackUrl })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
            <Brain className="h-12 w-12 text-purple-600" />
            <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              NoteMind
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-gray-600">
            {isSignUp ? 'Start your journey with NoteMind' : 'Sign in to your account to continue'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Tab Switcher */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false)
                setApiError(null)
                loginForm.resetForm()
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-200 ${
                !isSignUp
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true)
                setApiError(null)
                signupForm.resetForm()
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-200 ${
                isSignUp
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* API Error Message */}
          {apiError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {apiError}
            </div>
          )}

          {/* Login Form */}
          {!isSignUp && (
            <form onSubmit={loginForm.handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    {...loginForm.getFieldProps('email')}
                    placeholder="you@example.com"
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all ${
                      loginForm.touched.email && loginForm.errors.email
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                </div>
                {loginForm.touched.email && loginForm.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{loginForm.errors.email}</p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    {...loginForm.getFieldProps('password')}
                    placeholder="••••••••"
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all ${
                      loginForm.touched.password && loginForm.errors.password
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                </div>
                {loginForm.touched.password && loginForm.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{loginForm.errors.password}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    {...loginForm.getFieldProps('rememberMe')}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <Link href="/forgot-password" className="text-sm font-medium text-purple-600 hover:text-purple-700">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loginForm.isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loginForm.isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          )}

          {/* Signup Form */}
          {isSignUp && (
            <form onSubmit={signupForm.handleSubmit} className="space-y-4">
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="firstName"
                      type="text"
                      {...signupForm.getFieldProps('firstName')}
                      placeholder="John"
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all ${
                        signupForm.touched.firstName && signupForm.errors.firstName
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {signupForm.touched.firstName && signupForm.errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{signupForm.errors.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="lastName"
                      type="text"
                      {...signupForm.getFieldProps('lastName')}
                      placeholder="Doe"
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all ${
                        signupForm.touched.lastName && signupForm.errors.lastName
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {signupForm.touched.lastName && signupForm.errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{signupForm.errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="signupEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="signupEmail"
                    type="email"
                    {...signupForm.getFieldProps('email')}
                    placeholder="you@example.com"
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all ${
                      signupForm.touched.email && signupForm.errors.email
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                </div>
                {signupForm.touched.email && signupForm.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{signupForm.errors.email}</p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="signupPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="signupPassword"
                    type="password"
                    {...signupForm.getFieldProps('password')}
                    placeholder="••••••••"
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all ${
                      signupForm.touched.password && signupForm.errors.password
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                </div>
                {signupForm.touched.password && signupForm.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{signupForm.errors.password}</p>
                )}
              </div>

              {/* Confirm Password Input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    {...signupForm.getFieldProps('confirmPassword')}
                    placeholder="••••••••"
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all ${
                      signupForm.touched.confirmPassword && signupForm.errors.confirmPassword
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                </div>
                {signupForm.touched.confirmPassword && signupForm.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{signupForm.errors.confirmPassword}</p>
                )}
              </div>

              {/* Terms Agreement */}
              <div>
                <div className="flex items-start">
                  <input
                    id="terms"
                    type="checkbox"
                    {...signupForm.getFieldProps('terms')}
                    className="h-4 w-4 mt-0.5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-gray-600">
                    I agree to the{' '}
                    <Link href="/terms" className="text-purple-600 hover:text-purple-700 font-medium">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-purple-600 hover:text-purple-700 font-medium">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {signupForm.touched.terms && signupForm.errors.terms && (
                  <p className="mt-1 text-sm text-red-600">{signupForm.errors.terms}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={signupForm.isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {signupForm.isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin('github')}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              <Github className="h-5 w-5" />
              GitHub
            </button>
          </div>
        </div>

        {/* Toggle Auth Mode Link */}
        <p className="text-center mt-6 text-gray-600">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setIsSignUp(false)
                  setApiError(null)
                  signupForm.resetForm()
                }}
                className="font-semibold text-purple-600 hover:text-purple-700"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => {
                  setIsSignUp(true)
                  setApiError(null)
                  loginForm.resetForm()
                }}
                className="font-semibold text-purple-600 hover:text-purple-700"
              >
                Sign up for free
              </button>
            </>
          )}
        </p>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
