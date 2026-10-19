import { SignUp } from "@clerk/clerk-react";
import AuthLayout from "../components/AuthLayout";
export default function SignUpPage() {
  return <AuthLayout><SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/"/></AuthLayout>;
}
