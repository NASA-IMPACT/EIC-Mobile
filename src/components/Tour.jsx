import React, { useState, useContext, useEffect } from 'react';
import { CurrentJSONContext } from '../contexts/AppContext';
import Joyride from 'react-joyride';
import TourButton from './TourButton';
import useLocalStorage from '../hooks/useLocalStorage';

export default function Tour() {
  const [tourComplete, setTourComplete] = useLocalStorage('tourComplete', false)
  const [helpers, setHelpers] = useState({})
  const [run, setRun] = useState(!tourComplete)
  const { currentJSON } = useContext(CurrentJSONContext)

  const steps = [
    {
      target: 'body',
      title: 'Welcome to EIC Mobile!',
      content: 'This tour will guide you through the app. You can skip this tour at any time.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.map',
      content: 'Select a location on the map to view data.',
      placement: 'top-start',
      disableBeacon: true,
    },
    {
      target: '.dataset-choice',
      title: 'Select a dataset to view.',
      content: `${currentJSON?.name}: ${currentJSON?.description}`,
      disableBeacon: true,
    },
    {
      target: '.chart',
      content: 'View the data in a chart.',
      disableBeacon: true,
    }
  ]
  

  const handleJoyrideCallback = (data) => {
    if (data.status === 'finished' || data.status === 'skipped' || data.action === 'close') {
      setTourComplete(true)
      setRun(false)
      helpers.reset()
    }
  }

  const handleGetHelpers = (helpers) => {
    setHelpers(helpers)
  }

  const handleClick = () => {
    setRun(!run)
  }

  return (
    <div>
      <TourButton onClick={handleClick} />
      <Joyride
        steps={steps}
        callback={handleJoyrideCallback}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        disableOverlay={true}
        getHelpers={handleGetHelpers}
        run={run}
      />
    </div>
  )
}