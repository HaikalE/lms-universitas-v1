import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { LoginRequest } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from 'react-toastify';

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('Login failed:', error);
      // Error handling is done in the auth context
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <AcademicCapIcon className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Masuk ke LMS Universitas
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Selamat datang kembali! Silakan masuk ke akun Anda.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              placeholder="Masukkan email Anda"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email wajib diisi',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Format email tidak valid',
                },
              })}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Masukkan password Anda"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password wajib diisi',
                  minLength: {
                    value: 6,
                    message: 'Password minimal 6 karakter',
                  },
                })}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Ingat saya
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Lupa password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sedang masuk...' : 'Masuk'}
          </Button>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Demo Akun:</h3>
            <div className="text-xs text-blue-800 space-y-1">
              <p><strong>Admin:</strong> admin@universitas.ac.id / admin123</p>
              <p><strong>Dosen:</strong> dr.ahmad@universitas.ac.id / lecturer123</p>
              <p><strong>Mahasiswa:</strong> andi.pratama@student.ac.id / student123</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
