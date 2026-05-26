import { Link, useNavigate } from "react-router-dom";
import { FormEvent } from "react";

export default function Signup() {
  const navigate = useNavigate();

  const handleSignup = (e: FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-light-background dark:bg-surface flex flex-col justify-center items-center px-4 font-body-md transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-surface-container-high border border-light-outline-variant dark:border-outline-variant rounded-[24px] shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl mx-auto flex items-center justify-center text-white mb-4">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
          </div>
          <h2 className="text-2xl font-display-lg font-bold text-slate-800 dark:text-on-surface">Create an account</h2>
          <p className="text-slate-500 dark:text-on-surface-variant text-sm mt-2">Start using Linguist AI today</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-label-md text-slate-700 dark:text-on-surface mb-1">Full Name</label>
            <input
              type="text"
              required
              className="w-full bg-light-surface-container dark:bg-surface-container-low border border-light-outline-variant dark:border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:text-on-surface"
              placeholder="Jane Doe"
            />
          </div>
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

          <button
            type="submit"
            className="w-full bg-primary text-white py-2.5 flex items-center justify-center font-bold rounded-xl mt-6 hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
          >
            Create account
          </button>
        </form>

        <p className="text-center text-slate-600 dark:text-on-surface-variant text-sm mt-8">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
