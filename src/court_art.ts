import type { CourtId } from './courts';
import type { CourtArt } from './court_common';
import { brooklyn, harlem, queens } from './art_ny';
import { chicago, detroit, philly } from './art_rust';
import { atl, la } from './art_south';
import { fairmount } from './art_park';
import { marseille } from './art_marseille';
import { chiraq, warsaw } from './art_cities';

export type { CourtArt };
export const ART: Record<CourtId, CourtArt> = { brooklyn, queens, harlem, philly, detroit, chicago, chiraq, warsaw, atl, la, fairmount, marseille };
