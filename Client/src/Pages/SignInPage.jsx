import { SignIn } from "@clerk/clerk-react";
import AuthLayout from "../components/AuthLayout";
import { useSearchParams } from "react-router-dom";
import { safeReturnPath } from "../utils/authReturn";
export default function SignInPage() {
  const [params] = useSearchParams();
  const returnTo = safeReturnPath(params.get("returnTo"));
  return (
    <AuthLayout>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl={`/sign-up?returnTo=${encodeURIComponent(returnTo)}`}
        forceRedirectUrl={returnTo}
      />
    </AuthLayout>
  );
}
