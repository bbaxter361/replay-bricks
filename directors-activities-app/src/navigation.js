import { BookOpen, CalendarDays, ContactRound, Gamepad2, Home, MessageCircle, Palette, Settings, Sparkles, UsersRound } from 'lucide-react';

export const navItems = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/app/spring', label: 'Spring', icon: MessageCircle },
  { to: '/app/activities', label: 'Activities', icon: Sparkles },
  { to: '/app/canva', label: 'Canva', icon: Palette },
  { to: '/app/residents', label: 'Residents', icon: UsersRound },
  { to: '/app/family', label: 'Family of Residents', icon: ContactRound },
  { to: '/app/books', label: 'Books', icon: BookOpen },
  { to: '/app/games', label: 'Games', icon: Gamepad2 },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];
