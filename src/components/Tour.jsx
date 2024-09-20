import React, { useState, useContext, useEffect } from 'react';
import Joyride from 'react-joyride';
import TourButton from './TourButton';
import useLocalStorage from '../hooks/useLocalStorage';

export default function Tour() {
  const [tourComplete, setTourComplete] = useLocalStorage('tourComplete', false)
  const [helpers, setHelpers] = useState({})
  const [run, setRun] = useState(!tourComplete)

  const steps = [
    {
      target: 'body',
      title: 'Welcome to <Application Name>!',
      content: 'The <Application Name> application is an extension of the in-person Earth Information Center exhibit at the Smithsonian National Museum of Natural History. Use this tool to explore how different emissions scenarios predict future changes in temperature at any location in the world.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.map',
      content: 'Tap anywhere on the map to view how temperatures are expected to change at that location',
      placement: 'top-start',
      disableBeacon: true,
    },
    {
      target: '.esri-search__container',
      content: 'Or search by location',
      disableBeacon: true,
    },
    {
      target: 'body',
      content: 'Learn how different emissions scenarios affect our future climate',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.dataset-choice',
      content: 'Select an emissions scenario',
      placement: 'top',
      disableBeacon: true,
    },
    {
      target: '.chart',
      content: 'View past and projected temperature changes from 1950-2100 based on the selected emissions scenario',
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