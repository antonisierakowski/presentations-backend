import { PresentationDbProviderInterface } from './PresentationDbProviderInterface';
import { AbstractDbProvider } from '../db/AbstractDbProvider';
import { injectable } from 'inversify';
import { Presentation, PresentationDbRow } from './types';
import { Table } from '../db/types';

const mapPresentationKeys = (presentation: Presentation) => ({
  number_of_slides: presentation.numberOfSlides,
  current_slide: presentation.currentSlide,
  file_name: presentation.fileName,
  file_type: presentation.fileType,
});

@injectable()
export class PresentationDbProvider extends AbstractDbProvider
  implements PresentationDbProviderInterface {
  async insertPresentationEntity(
    presentation: Presentation,
  ): Promise<PresentationDbRow> {
    const query = await this.connection.getConnection();

    try {
      const result = await query
        .table(Table.Presentation)
        .insert(mapPresentationKeys(presentation))
        .returning('*');
      return result[0];
    } catch (error) {
      this.handleDbError(error);
    }
  }

  async getPresentationEntity(id: string): Promise<PresentationDbRow> {
    const query = await this.connection.getConnection();

    try {
      return await query
        .select()
        .from(Table.Presentation)
        .where({ id })
        .first();
    } catch (error) {
      this.handleDbError(error);
    }
  }

  async updatePresentationEntity(
    presentation: Partial<Presentation>,
  ): Promise<void> {
    const query = await this.connection.getConnection();

    try {
      return await query
        .table(Table.Presentation)
        .where({ id: presentation.id })
        .update(mapPresentationKeys(presentation as Presentation));
    } catch (error) {
      this.handleDbError(error);
    }
  }

  async deletePresentationEntity(id: string): Promise<void> {
    const query = await this.connection.getConnection();
    try {
      await query.table(Table.Presentation).where({ id }).delete();
    } catch (error) {
      this.handleDbError(error);
    }
  }
}
