import { createRoot } from 'react-dom/client';
import { Panel } from './Panel';
import '../../assets/main.css';

const root = document.getElementById('root')!;
createRoot(root).render(<Panel />);
