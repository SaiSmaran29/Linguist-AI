import { Link, useNavigate } from "react-router-dom";
import { FormEvent } from "react";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-light-background dark:bg-surface flex flex-col justify-center items-center px-4 font-body-md transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-surface-container-high border border-light-outline-variant dark:border-outline-variant rounded-[24px] shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl mx-auto flex items-center justify-center text-white mb-4">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              translate
            </span>
          </div>
          <h2 className="text-2xl font-display-lg font-bold text-slate-800 dark:text-on-surface">Welcome back</h2>
          <p className="text-slate-500 dark:text-on-surface-variant text-sm mt-2">Sign in to Linguist AI to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-label-md text-slate-700 dark:text-on-surface mb-1">Email address</label>
            <input
              type="email"
              required
              className="w-full bg-light-surface-container dark:bg-surface-container-low border border-light-outline-variant dark:border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:text-on-surface"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-label-md text-slate-700 dark:text-on-surface mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full bg-light-surface-container dark:bg-surface-container-low border border-light-outline-variant dark:border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:text-on-surface"
              placeholder="••••••••"
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary" />
              <span className="text-slate-600 dark:text-on-surface-variant">Remember me</span>
            </label>
            <a href="#" className="text-primary hover:underline font-semibold">Forgot password?</a>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-2.5 flex items-center justify-center font-bold rounded-xl mt-6 hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
          >
            Sign in
          </button>
        </form>

        <p className="text-center text-slate-600 dark:text-on-surface-variant text-sm mt-8">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
