import React from 'react';
import Joyride from 'react-joyride';

import useLocalStorage from '../hooks/useLocalStorage';

const steps = [
  {
    target: 'body',
    title: 'Welcome to EIC Mobile!',
    content: 'This tour will guide you through the app. You can skip this tour at any time.',
    placement: 'center',
  },
  {
    target: '.map',
    content: 'Select a location on the map to view data.',
    placement: 'auto',
  },
  {
    target: '.dataset-choice',
    content: 'Select a dataset to view.',
  },
  {
    target: '.dataset-0',
    content: 'Dataset 1',
  },
  {
    target: '.dataset-1',
    content: 'Dataset 2',
  },
  {
    target: '.dataset-2',
    content: 'Dataset 3',
  },
  {
    target: '.chart',
    content: 'View the data in a chart.',
  }
]

export default function Tour() {
  const [tourComplete, setTourComplete] = useLocalStorage('tourComplete', false);

  if (tourComplete) return null

  const handleJoyrideCallback = (data) => {
    if (data.status === 'finished' || data.status === 'skipped') setTourComplete(true)
  }

  return (
    <Joyride
      steps={steps}
      callback={handleJoyrideCallback}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      disableOverlay={true}
    />
  );
}