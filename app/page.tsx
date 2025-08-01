'use client'

import Game from '../components/Game';
import styles from '../styles/home.module.css';

export default function HomePage() {
  return (
    <main className={styles.main}>
      <Game />
    </main>
  );
}
