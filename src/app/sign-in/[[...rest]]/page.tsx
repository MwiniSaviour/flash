import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-5 py-10">
      <SignIn />
    </main>
  );
}
