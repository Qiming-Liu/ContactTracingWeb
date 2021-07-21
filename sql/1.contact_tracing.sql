SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE `history` (
  `id` int NOT NULL,
  `mobile` bigint NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `position` json NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `person` (
  `mobile` bigint NOT NULL,
  `role` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'user',
  `status` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Good',
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(62) DEFAULT NULL,
  `facebook` varchar(255) DEFAULT NULL,
  `google` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `venue` (
  `id` int NOT NULL,
  `mobile` bigint NOT NULL,
  `name` varchar(1000) NOT NULL,
  `position` json NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `history_mobile` (`mobile`);

ALTER TABLE `person`
  ADD PRIMARY KEY (`mobile`);

ALTER TABLE `venue`
  ADD PRIMARY KEY (`id`),
  ADD KEY `venue_mobile` (`mobile`);

ALTER TABLE `history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=304;

ALTER TABLE `venue`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=121;

ALTER TABLE `history`
  ADD CONSTRAINT `history_mobile` FOREIGN KEY (`mobile`) REFERENCES `person` (`mobile`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `venue`
  ADD CONSTRAINT `venue_mobile` FOREIGN KEY (`mobile`) REFERENCES `person` (`mobile`) ON DELETE RESTRICT ON UPDATE RESTRICT;
COMMIT;