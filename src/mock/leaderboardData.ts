import jenny from '@/assets/users/Jenny.png'
import meghan from '@/assets/users/Meghan.png'
import alex from '@/assets/users/Alex.jpg'
import giulia from '@/assets/users/Giulia.png'
import luca from '@/assets/users/Luca.png'
import you from '@/assets/users/you.png'
import elena from '@/assets/users/Elena.png'
import antonioRomano from '@/assets/users/antonio_romano.png'
import giorgiaVerde from '@/assets/users/giorgia_verde.png'
import marcoSole from '@/assets/users/marco_sole.png'
export const leaderboardData = {
  users: [
    {
      id: 1,
      name: 'Jenny Wilson',
      score: 200,
      image: jenny,
      isCurrentUser: false,
      rank: 1,
    },
    {
      id: 2,
      name: 'Meghan Jes...',
      score: 150,
      image: meghan,
      isCurrentUser: false,
      rank: 2,
    },
    {
      id: 3,
      name: 'Alex Turner',
      score: 100,
      image: alex,
      isCurrentUser: false,
      rank: 3,
    },
    {
      id: 4,
      name: 'Giulia Rossi',
      score: 90,
      image: giulia,
      isCurrentUser: false,
      rank: 4,
    },
    {
      id: 5,
      name: 'Luca Bianchi',
      score: 80,
      image: luca,
      isCurrentUser: false,
      rank: 5,
    },
    {
      id: 6,
      name: 'You',
      score: 75,
      image: you,
      isCurrentUser: true,
      rank: 6,
    },
    {
      id: 7,
      name: 'Elena Fiore',
      score: 70,
      image: elena,
      isCurrentUser: false,
      rank: 7,
    },
    {
      id: 8,
      name: 'Antonio Romano',
      score: 67,
      image: antonioRomano,
      isCurrentUser: false,
      rank: 8,
    },
    {
      id: 9,
      name: 'Giorgia Verde',
      score: 60,
      image: giorgiaVerde,
      isCurrentUser: false,
      rank: 9,
    },
    {
      id: 10,
      name: 'Marco Sole',
      score: 58,
      image: marcoSole,
      isCurrentUser: false,
      rank: 10,
    },
  ],
  tabs: [
    {
      id: 'all',
      label: 'pages.leaderboard.tabs.all',
    },
    {
      id: 'productSkillDevelopment',
      label: 'pages.leaderboard.tabs.productSkillDevelopment',
      active: true,
    },
    {
      id: 'productTraining',
      label: 'pages.leaderboard.tabs.productTraining',
    },
    {
      id: 'development',
      label: 'pages.leaderboard.tabs.development',
    },
  ],
}
