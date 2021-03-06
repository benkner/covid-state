import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { State } from '../_classes/state';
import { Statistics } from '../_classes/statistics';

@Injectable({ providedIn: 'root' })
export class ApiService {
  /* tslint:disable:quotemark object-literal-key-quotes */
  private readonly apiUrlRki = 'https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?';
  private readonly outStatistics = [
    { 'statisticType': 'sum', 'onStatisticField': 'AnzahlFall', 'outStatisticFieldName': 'cases' },
    { 'statisticType': 'sum', 'onStatisticField': 'AnzahlTodesfall', 'outStatisticFieldName': 'deaths' },
    { 'statisticType': 'sum', 'onStatisticField': 'AnzahlGenesen', 'outStatisticFieldName': 'recovered' },
    { 'statisticType': 'min', 'onStatisticField': 'MeldeDatum', 'outStatisticFieldName': 'date' },
    { 'statisticType': 'min', 'onStatisticField': 'Datenstand', 'outStatisticFieldName': 'status' }];

  constructor(
    private http: HttpClient
  ) { }

  /** Requests a list of states by the API. */
  getStateList(): Observable<State[]> {
    const url = this.apiUrlRki +
      "where=1%3D1" +
      "&outFields=Bundesland,IdBundesland" +
      "&returnDistinctValues=true" +
      "&f=json";
    return this.http.get<ArcGisResponseTypeListStates>(url)
      .pipe(map<ArcGisResponseTypeListStates, State[]>(x => x.features.map(a => {
        return { name: a.attributes.Bundesland, id: a.attributes.IdBundesland };
      })));
  }

  /** Get the statistics of germany of the last passed days. */
  getHistoryGermany(days: number): Observable<Statistics> {
    const url = this.apiUrlRki +
      "where=MeldeDatum >= CURRENT_TIMESTAMP - INTERVAL '" + (days + 1) + "' DAY" +
      " AND MeldeDatum <= CURRENT_TIMESTAMP - INTERVAL '1' DAY" +
      "&outStatistics=" + JSON.stringify(this.outStatistics) +
      "&f=json";
    return this.http.get<ArcGisResponseTypeStatistics>(url)
      .pipe(map(x => x.features[0].attributes));
  }

  /** Get the statistics of a state of the last passed days. */
  getHistoryState(days: number, stateId: number): Observable<Statistics> {
    const url = this.apiUrlRki +
      "where=MeldeDatum >= CURRENT_TIMESTAMP - INTERVAL '" + (days + 1) + "' DAY" +
      " AND MeldeDatum <= CURRENT_TIMESTAMP - INTERVAL '1' DAY" +
      " AND IdBundesland = " + stateId +
      "&outStatistics=" + JSON.stringify(this.outStatistics) +
      "&f=json";
    return this.http.get<ArcGisResponseTypeStatistics>(url)
      .pipe(map(x => x.features[0].attributes));
  }
}

/** Response type of the arcGis API for the list of states. */
type ArcGisResponseTypeListStates = {
  features: {
    attributes: {
      Bundesland: string;
      IdBundesland: number;
    }
  }[],
  fields: any[];
};

/** Response type of the arcGis API for the requested statistics. */
type ArcGisResponseTypeStatistics = {
  features: {
    attributes: Statistics
  }[],
  fields: any[];
};
