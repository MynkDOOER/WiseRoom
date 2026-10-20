import { SignUp } from "@clerk/clerk-react";
import AuthLayout from "../components/AuthLayout";
import { useSearchParams } from "react-router-dom";
import { safeReturnPath } from "../utils/authReturn";
export default function SignUpPage() {
  const [params] = useSearchParams();
  const returnTo = safeReturnPath(params.get("returnTo"));
  return (
    <AuthLayout>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`}
        forceRedirectUrl={returnTo}
      />
    </AuthLayout>
  );
}
