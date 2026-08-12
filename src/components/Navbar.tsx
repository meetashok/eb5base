'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Logo from '@/components/Logo';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';
import { resolveProfileAvatar } from '@/lib/profile-avatar';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
          .then(({ data: p }) => setProfile(p));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: p }) => setProfile(p));
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const isActive = (href: string, match: 'exact' | 'prefix' = 'prefix') => {
    if (match === 'exact') return pathname === href;
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  const navLink = (href: string, label: string, match: 'exact' | 'prefix' = 'prefix') => {
    const active = isActive(href, match);
    return (
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`relative px-2 lg:px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-150 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm ${
          active ? 'text-accent' : 'text-primary-content/90'
        }`}
      >
        {label}
        {active ? (
          <span
            className="absolute left-2 right-2 lg:left-3 lg:right-3 -bottom-0.5 h-0.5 rounded-full bg-accent"
            aria-hidden
          />
        ) : null}
      </Link>
    );
  };

  const avatarUrl = resolveProfileAvatar(profile, user);
  const onboarded = Boolean(profile?.onboarding_complete);

  const caseTrackerActive = isActive('/tracker');
  const caseTrackerLink = (
    <Link
      href="/tracker"
      aria-current={caseTrackerActive ? 'page' : undefined}
      className={`relative px-2 lg:px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-150 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm inline-flex items-center gap-1.5 ${
        caseTrackerActive ? 'text-accent' : 'text-primary-content/90'
      }`}
    >
      <span>Case Tracker</span>
      <span className="rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-accent/20 text-accent leading-none">
        Soon
      </span>
      {caseTrackerActive ? (
        <span
          className="absolute left-2 right-2 lg:left-3 lg:right-3 -bottom-0.5 h-0.5 rounded-full bg-accent"
          aria-hidden
        />
      ) : null}
    </Link>
  );

  const mainLinks = (
    <>
      {navLink('/nprm', 'NPRM')}
      {navLink('/status', 'Status Update')}
      {caseTrackerLink}
      {navLink('/resources', 'Resources')}
    </>
  );

  return (
    <header className="bg-nav-gradient text-primary-content shadow-nav">
      <div className="navbar max-w-6xl mx-auto px-4 min-h-16">
        <div className="navbar-start gap-1">
          <Link href="/" className="hover:opacity-90 transition-opacity inline-flex items-center gap-2">
            <Logo
              size={36}
              showWordmark
              wordmarkVariant="on-dark"
              wordmarkClassName="text-xl sm:text-[1.35rem]"
            />
            <span className="badge badge-xs rounded-full border border-copper/50 bg-copper/20 text-copper-light font-semibold uppercase tracking-wider px-1.5 min-h-0 h-4 text-[9px]">
              Beta
            </span>
          </Link>
        </div>

        <div className="navbar-center hidden md:flex flex-wrap justify-center items-center gap-0.5">
          {mainLinks}
        </div>

        <div className="navbar-end gap-2">
          {user ? (
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar placeholder"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-primary-content text-primary w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold">
                    {(profile?.display_name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 text-neutral rounded-box z-[1] w-52 p-2 shadow-sm border border-base-300 mt-2"
              >
                <li>
                  <Link href="/profile">Profile</Link>
                </li>
                {onboarded && (
                  <li>
                    <Link href="/tracker/settings">Case Tracker settings</Link>
                  </li>
                )}
                {profile?.is_admin && (
                  <li>
                    <Link href="/admin">Approvals</Link>
                  </li>
                )}
                <li>
                  <button type="button" onClick={handleSignOut}>
                    Sign Out
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <Link href="/login" className="btn btn-sm btn-accent text-accent-content shadow-soft hover:shadow-glow transition-all duration-200">
              Sign In
            </Link>
          )}

          <button
            type="button"
            className="btn btn-ghost btn-sm md:hidden"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-primary-content/20 px-4 pb-4 flex flex-col">
          {mainLinks}
        </div>
      )}
    </header>
  );
}
