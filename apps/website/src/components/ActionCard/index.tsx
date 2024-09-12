import styles from "./styles.module.css";

interface ActionCardProps {
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
}

const ActionCard: React.FC<ActionCardProps> = ({ buttonText, buttonUrl, description, title }: ActionCardProps) => (
  <div className={styles.actionCard}>
    <div className={styles.actionCardBody}>
      <div className={styles.actionCardContent}>
        <div className={styles.actionCardText}>
          <h2 className={styles.actionCardTitle}>{title}</h2>

          <p className={styles.actionCardDescription}>{description}</p>
        </div>

        <div className={styles.actionCardButtonContainer}>
          <a className={styles.actionCardButton} href={buttonUrl} rel="noopener noreferrer" target="_blank">
            {buttonText}
          </a>
        </div>
      </div>
    </div>
  </div>
);

export default ActionCard;
