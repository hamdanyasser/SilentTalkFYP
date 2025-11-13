import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store';

/**
 * Typed hook for dispatch
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();
