import {
  steamGameAchievementsRepository,
  steamGameRepository,
} from "@main/repository";
import { steamGlobalAchievementPercentages } from "./steam-global-achievement-percentages";
import { steamAchievementInfo } from "./steam-achievement-info";
import { steamAchievementMerge } from "./steam-achievement-merge";
import { Achievement } from "../types";

export const steamGetAchivement = async (
  steamGameId: number
): Promise<Achievement[] | undefined> => {
  const steamGame = await steamGameRepository.findOne({
    where: { id: steamGameId },
  });

  if (!steamGame) return;

  const gameAchivement = await steamGameAchievementsRepository.findOne({
    where: { steamGame },
  });

  if (!gameAchivement) {
    const achievementPercentage =
      await steamGlobalAchievementPercentages(steamGameId);

    if (!achievementPercentage) {
      await steamGameAchievementsRepository.save({
        steamGame,
        achievements: "[]",
      });
      return [];
    }

    const achievementInfo = await steamAchievementInfo(steamGameId);

    if (!achievementInfo) return;

    const achievements = steamAchievementMerge(
      achievementPercentage,
      achievementInfo
    );

    if (!achievements) return;

    await steamGameAchievementsRepository.save({
      steamGame,
      achievements: JSON.stringify(achievements),
    });

    return achievements;
  } else {
    return JSON.parse(gameAchivement.achievements);
  }
};
