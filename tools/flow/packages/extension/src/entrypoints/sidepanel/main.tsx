import { createRoot } from 'react-dom/client';
import { SidePanel } from './SidePanel';
import '../../assets/main.css';

const root = document.getElementById('root')!;
createRoot(root).render(<SidePanel />);
