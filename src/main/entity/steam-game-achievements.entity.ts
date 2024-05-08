import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SteamGame } from "./steam-game.entity";

@Entity("steam_game_achievements")
export class SteamGameAchievements {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => SteamGame)
  @JoinColumn()
  steamGame: SteamGame;

  @Column("text", { nullable: true })
  achievements: string;
}
