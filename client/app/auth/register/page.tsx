import { AuthForm } from '@/components/auth-form'

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <AuthForm mode="register" />
    </div>
  )
}
