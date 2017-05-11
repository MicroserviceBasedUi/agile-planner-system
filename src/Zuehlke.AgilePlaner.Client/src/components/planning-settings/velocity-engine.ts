import { Sprint, Velocity } from '../shared';

export class VelocityEnginge {

    public CalculateVelocity(completedSprints: Array<Sprint>): Velocity {
        let minVelocity = 0;
        let maxVelocity = 0;
        let avgVelocity = 0;

        for (let i = 0; i < completedSprints.length; i++) {
            let velocity: number = 0;
            completedSprints[i].stories.forEach(s => velocity += s.storyPoints);

            avgVelocity += velocity;

            if (i === 0) {
                minVelocity = velocity;
            }

            if (velocity < minVelocity) {
                minVelocity = velocity;
            }

            if (velocity > maxVelocity) {
                maxVelocity = velocity;
            }
        }

        avgVelocity = Math.round(avgVelocity / completedSprints.length);

        return {
            min: minVelocity,
            max: maxVelocity,
            average: avgVelocity
        };
    }

}
