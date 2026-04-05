import { useMemo } from 'react';
import { paths } from 'src/routes/paths';
import { SafeOmit } from 'src/types';

const systems = ['22XX', 'GF300', 'SF500', 'GM400', 'Heracles'] as const;

type System = (typeof systems)[number];

type Location = {
  id: string[];
};

type SystemLocations = {
  [locationName: string]: Location;
};

type SystemProps = {
  id: System;
  pathToCardImage: string;
  titleTranslation: string;
  contentTranslation: string;
  pageLinkTo: string;
  locations?: SystemLocations;
};

export const useSystems = () =>
  useMemo(() => {
    const map: {
      [S in System]: SafeOmit<SystemProps, 'id' | 'pageLinkTo'>;
    } = {
      '22XX': {
        pathToCardImage: '/img/card-1.jpg',
        titleTranslation: 'dashboard.home.card-1.title',
        contentTranslation: 'dashboard.home.card-1.content',
        locations: {
          'cinq-mars-la-pile': {
            id: ['DKDSJSDHDSAFI', 'WEEWEWDSADSD', 'QEDKSFHASDHADADS'],
          },
          'mont-de-marsan': {
            id: ['SDASFASFSA', 'ASDASASD', 'SADASD'],
          },
          brest: {
            id: ['QWEQWE', 'ADSADS', 'ASDAD'],
          },
        },
      },
      GF300: {
        pathToCardImage: '/img/card-2.jpg',
        titleTranslation: 'dashboard.home.card-2.title',
        contentTranslation: 'dashboard.home.card-2.content',
        locations: {
          paris: {
            id: ['PARIS001', 'PARIS002', 'PARIS003'],
          },
          toulouse: {
            id: ['TOULOUSE001', 'TOULOUSE002', 'TOULOUSE003'],
          },
          lyon: {
            id: ['LYON001', 'LYON002', 'LYON003'],
          },
        },
      },
      SF500: {
        pathToCardImage: '/img/card-3.jpg',
        titleTranslation: 'dashboard.home.card-3.title',
        contentTranslation: 'dashboard.home.card-3.content',
        locations: {
          marseille: {
            id: ['MARS001', 'MARS002', 'MARS003'],
          },
          nice: {
            id: ['NICE001', 'NICE002', 'NICE003'],
          },
          cannes: {
            id: ['CANNES001', 'CANNES002', 'CANNES003'],
          },
        },
      },
      GM400: {
        pathToCardImage: '/img/card-4.jpg',
        titleTranslation: 'dashboard.home.card-4.title',
        contentTranslation: 'dashboard.home.card-4.content',
        locations: {
          bordeaux: {
            id: ['BORDEAUX001', 'BORDEAUX002', 'BORDEAUX003'],
          },
          nantes: {
            id: ['NANTES001', 'NANTES002', 'NANTES003'],
          },
          rennes: {
            id: ['RENNES001', 'RENNES002', 'RENNES003'],
          },
        },
      },
      Heracles: {
        pathToCardImage: '/img/card-5.jpg',
        titleTranslation: 'dashboard.home.card-5.title',
        contentTranslation: 'dashboard.home.card-5.content',
        locations: {
          athens: {
            id: ['ATHENS001', 'ATHENS002', 'ATHENS003'],
          },
          sparta: {
            id: ['SPARTA001', 'SPARTA002', 'SPARTA003'],
          },
          corinth: {
            id: ['CORINTH001', 'CORINTH002', 'CORINTH003'],
          },
        },
      },
    };

    return systems.map((sId) => ({
      ...map[sId],
      id: sId,
      pageLinkTo: paths.systems.system.replace(':systemId', sId),
    }));
  }, []);
