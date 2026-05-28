import { TFL_API_BASE } from '../constants';
import { Journey, JourneyLookupResult, JourneyResponse } from '../types';

interface DisambiguationOption {
  parameterValue?: string;
}

interface DisambiguationSection {
  disambiguationOptions?: DisambiguationOption[];
}

interface DisambiguationResponse {
  fromLocationDisambiguation?: DisambiguationSection;
  toLocationDisambiguation?: DisambiguationSection;
}

const buildJourneyUrl = (from: string, to: string): string => {
  return `${TFL_API_BASE}/Journey/JourneyResults/${encodeURIComponent(from)}/to/${encodeURIComponent(to)}`;
};

const readJourneyResponse = async (response: Response): Promise<Journey[]> => {
  const data = (await response.json()) as JourneyResponse;
  return data.journeys || [];
};

const resolveDisambiguation = async (response: Response): Promise<{ fromId: string; toId: string }> => {
  const disambiguationData = (await response.json()) as DisambiguationResponse;

  const fromId =
    disambiguationData.fromLocationDisambiguation?.disambiguationOptions?.[0]?.parameterValue;
  const toId =
    disambiguationData.toLocationDisambiguation?.disambiguationOptions?.[0]?.parameterValue;

  if (!fromId || !toId) {
    throw new Error('Could not resolve stations');
  }

  return { fromId, toId };
};

export const fetchJourneyOptions = async (
  fromValue: string,
  toValue: string
): Promise<JourneyLookupResult> => {
  try {
    const firstUrl = buildJourneyUrl(fromValue, toValue);
    const firstResponse = await fetch(firstUrl);

    let journeys: Journey[] = [];

    if (firstResponse.status === 300) {
      const { fromId, toId } = await resolveDisambiguation(firstResponse);
      const secondUrl = buildJourneyUrl(fromId, toId);
      const secondResponse = await fetch(secondUrl);

      if (!secondResponse.ok) {
        throw new Error(`API error: ${secondResponse.status}`);
      }

      journeys = await readJourneyResponse(secondResponse);
    } else if (firstResponse.ok) {
      journeys = await readJourneyResponse(firstResponse);
    } else {
      throw new Error(`API error: ${firstResponse.status}`);
    }

    if (journeys.length > 0) {
      return { kind: 'success', journeys };
    }

    return { kind: 'empty' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown request error';
    return { kind: 'request_failed', error: errorMessage };
  }
};
