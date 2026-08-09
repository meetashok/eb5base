'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Logo from '@/components/Logo';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';
import { resolveProfileAvatar } from '@/lib/profile-avatar';

const TOOLS_LINKS = [
  { href: '/', label: 'Home', match: 'exact' as const },
  { href: '/nprm', label: 'NPRM Explainer', match: 'nprm-overview' as const },
  { href: '/nprm/comments', label: 'Comments', match: 'prefix' as const },
  { href: '/status', label: 'Status Update', match: 'prefix' as const },
  { href: '/about', label: 'About', match: 'prefix' as const },
  { href: '/disclaimer', label: 'Disclaimer', match: 'prefix' as const },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

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
    setToolsOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const isActive = (href: string, match: 'exact' | 'prefix' | 'nprm-overview' = 'prefix') => {
    if (match === 'exact') return pathname === href;
    if (match === 'nprm-overview') {
      return pathname === '/nprm' || pathname === '/nprm/';
    }
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  const navLink = (href: string, label: string, match: 'exact' | 'prefix' = 'prefix') => {
    const active = isActive(href, match);
    return (
      <Link
        href={href}
        className={`relative px-2 lg:px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-150 hover:text-accent ${
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
  const caseTrackerHref = onboarded ? '/tracker/timeline' : '/tracker';
  const toolsActive = TOOLS_LINKS.some((l) => isActive(l.href, l.match));

  const mainLinks = (
    <>
      {navLink('/nprm', 'NPRM')}
      {navLink('/status', 'Status Update')}
      {navLink(caseTrackerHref, 'Case Tracker')}
      {onboarded && (
        <>
          {navLink('/tracker/timeline', 'Timeline')}
          {navLink('/tracker/insights', 'Insights')}
          {navLink('/tracker/settings', 'Settings')}
        </>
      )}
      {navLink('/resources', 'Resources')}
      {navLink('/about', 'About')}
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
          <div className="relative">
            <button
              type="button"
              className={`relative px-2 lg:px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-150 hover:text-accent ${
                toolsActive || toolsOpen ? 'text-accent' : 'text-primary-content/90'
              }`}
              aria-expanded={toolsOpen}
              aria-haspopup="menu"
              onClick={() => setToolsOpen((o) => !o)}
            >
              Tools
              {(toolsActive || toolsOpen) && (
                <span
                  className="absolute left-2 right-2 lg:left-3 lg:right-3 -bottom-0.5 h-0.5 rounded-full bg-accent"
                  aria-hidden
                />
              )}
            </button>
            {toolsOpen && (
              <ul
                role="menu"
                className="absolute left-0 top-full mt-1 z-[60] min-w-[12rem] rounded-lg border border-base-300 bg-base-100 text-neutral shadow-soft py-1"
              >
                {TOOLS_LINKS.map((item) => (
                  <li key={item.href} role="none">
                    <Link
                      role="menuitem"
                      href={item.href}
                      className={`block px-3 py-2 text-sm hover:bg-base-200 ${
                        isActive(item.href, item.match)
                          ? 'font-semibold text-secondary'
                          : ''
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
          <p className="text-[10px] uppercase tracking-wider font-bold text-primary-content/50 mt-2 mb-1">
            Tools
          </p>
          {TOOLS_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-2 py-2 text-sm font-medium ${
                isActive(item.href, item.match) ? 'text-accent' : 'text-primary-content/90'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <p className="text-[10px] uppercase tracking-wider font-bold text-primary-content/50 mt-3 mb-1">
            More
          </p>
          {mainLinks}
        </div>
      )}
    </header>
  );
}
