import { LoginComponent } from "@components/ui/login";
import { BaseLayout } from "@components/ui/layout";

export default function Login() {
  return (
    <>
      <div className=" py-4">
        <LoginComponent />
      </div>
    </>
  );
}
Login.Layout = BaseLayout;
