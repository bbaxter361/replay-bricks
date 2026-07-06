import { BookOpen, CalendarDays, ContactRound, Gamepad2, Home, MessageCircle, Palette, Settings, Sparkles, UsersRound } from 'lucide-react';

export const navItems = [
  { to: '/app', label: 'Dashboard', icon: Home, end: true },
  { to: '/app/spring', label: 'Spring', icon: MessageCircle },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/app/canva', label: 'Canva', icon: Palette },
  { to: '/app/activities', label: 'Activities', icon: Sparkles },
  { to: '/app/residents', label: 'Residents', icon: UsersRound },
  { to: '/app/contacts', label: 'Contacts', icon: ContactRound },
  { to: '/app/books', label: 'Books', icon: BookOpen },
  { to: '/app/games', label: 'Games', icon: Gamepad2 },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];
