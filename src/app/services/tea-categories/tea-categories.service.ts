import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

import { TeaCategory } from '@app/models';
import { DatabaseService } from '@app/services/database/database.service';

@Injectable({
  providedIn: 'root',
})
export class TeaCategoriesService {
  constructor(private database: DatabaseService) {}

  async getAll(): Promise<Array<TeaCategory>> {
    const cats: Array<TeaCategory> = [];
    await this.database.ready();
    await this.database.handle.transaction(tx =>
      tx.executeSql(
        'SELECT * FROM TeaCategories ORDER BY name',
        [],
        // tslint:disable-next-line:variable-name
        (_t, r) => {
          for (let i = 0; i < r.rows.length; i++) {
            cats.push(r.rows.item(i));
          }
        },
      ),
    );
    return cats;
  }

  async get(id: string): Promise<TeaCategory> {
    let cat: TeaCategory = null;
    await this.database.ready();
    await this.database.handle.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM TeaCategories WHERE id = ?',
        [id],
        // tslint:disable-next-line:variable-name
        (_t, r) => {
          if (r.rows.length) {
            cat = { ...r.rows.item(0) };
          }
        },
      );
    });
    return cat;
  }

  async save(category: TeaCategory): Promise<TeaCategory> {
    return category.id ? this.update(category) : this.add(category);
  }

  async delete(id: number): Promise<void> {
    await this.database.ready();
    await this.database.handle.transaction(tx =>
      tx.executeSql('DELETE FROM TeaCategories WHERE id = ?', [id], () => {}),
    );
  }

  private async add(category: TeaCategory): Promise<TeaCategory> {
    await this.database.ready();
    const cat = { ...category };
    await this.database.handle.transaction(tx => {
      tx.executeSql(
        'SELECT COALESCE(MAX(id), 0) + 1 AS newId FROM TeaCategories',
        [],
        // tslint:disable-next-line:variable-name
        (_t, r) => {
          cat.id = r.rows.item(0).newId;
          tx.executeSql(
            'INSERT INTO TeaCategories (id, name, description) VALUES (?, ?, ?)',
            [cat.id, cat.name, cat.description],
            () => {},
          );
        },
      );
    });
    return cat;
  }

  private async update(category: TeaCategory): Promise<TeaCategory> {
    await this.database.ready();
    this.database.handle.transaction(tx => {
      tx.executeSql(
        'UPDATE TeaCategories SET name = ?, description = ? WHERE id = ?',
        [category.name, category.description, category.id],
        () => {},
      );
    });
    return category;
  }
}
