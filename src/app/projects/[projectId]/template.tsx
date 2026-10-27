// Templates re-mount on every navigation, so each section fades in when its tab is opened.
export default function ProjectSectionTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-up">{children}</div>;
}
