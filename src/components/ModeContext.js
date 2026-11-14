import { createContext, useContext } from 'react';
/** 'student' | 'expert' – decides which cast (names + figures) the avatars show. */
export const ModeContext = createContext('student');
export const useMode = () => useContext(ModeContext);
