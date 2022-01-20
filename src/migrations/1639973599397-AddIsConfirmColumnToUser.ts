import {MigrationInterface, QueryRunner} from "typeorm";

export class AddIsConfirmColumnToUser1639973599397 implements MigrationInterface {
    name = 'AddIsConfirmColumnToUser1639973599397'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "isConfirm" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isConfirm"`);
    }

}
