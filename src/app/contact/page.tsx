export const metadata = {
  title: 'Contact',
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-6">Contact</h1>
      <p className="text-sm text-neutral/80 mb-4">
        For feedback, corrections, or questions about EB5 Base, email us at:
      </p>
      <a href="mailto:hello@eb5base.com" className="link link-secondary text-lg font-medium">
        hello@eb5base.com
      </a>
    </div>
  );
}
