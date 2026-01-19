## Packages
framer-motion | Page transitions, micro-interactions, and complex animations
recharts | Dashboard analytics visualization
canvas-confetti | Celebration effect on survey completion
clsx | Utility for conditional class names (standard with tailwind-merge)
tailwind-merge | Utility for merging tailwind classes
lucide-react | Icons (already in stack but good to confirm usage)
zod | Schema validation (already in stack)
@radix-ui/react-dialog | Accessible modals
@radix-ui/react-progress | Progress bars
@radix-ui/react-tooltip | Tooltips
@radix-ui/react-slot | Component composition

## Notes
- Theme: Dark mode by default with vibrant gradients (Purple/Green/Orange).
- Font strategy: 'Outfit' for headings (Display), 'DM Sans' for body.
- Survey Logic: The instrument data (dimensions/indicators) will be hardcoded on the client for this version to ensure instant interactivity, but results are submitted to the API.
- Dashboard: Visualizes the distribution of Red/Yellow/Green answers.
- UX: Haptic feedback simulation on mobile using navigator.vibrate.
