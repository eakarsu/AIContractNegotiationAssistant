import { useContext } from 'react';
import { ConfirmContext } from '../components/ConfirmDialog';

export function useConfirm() {
  return useContext(ConfirmContext).confirm;
}
