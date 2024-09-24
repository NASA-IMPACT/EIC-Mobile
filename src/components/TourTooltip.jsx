import styled from 'styled-components';

const PRIMARY_COLOR = '#3661e1'

const TooltipContainer = styled.div` 
  background-color: rgb(255, 255, 255);
  border-radius: 5px;
  box-sizing: border-box;
  color: rgb(51, 51, 51);
  font-size: 16px;
  max-width: 100%;
  padding: 15px;
  position: relative;
  width: 380px;
  box-shadow: 8px 8px 5px rgba(0, 32, 63, 0.35);
`

const TooltipClose = styled.button`
  background-color: transparent;
  border: 0px;
  border-radius: 0px;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  padding: 15px;
  appearance: none;
  position: absolute;
  right: 0px;
  top: 0px;
`

const TooltipTitle = styled.h1`
  font-size: 18px;
  margin: 0px;
`

const TooltipContent = styled.div`
  padding: 20px 10px;
`

const TooltipFooter = styled.div`
  align-items: center;
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
`

const BackButton = styled.button`
  background-color: transparent;
  border: 0px;
  border-radius: 0px;
  color: #005ece;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 8px;
  appearance: none;
  margin-left: auto;
  margin-right: 5px;
`

const PrimaryButton = styled.button`
  background-color: ${PRIMARY_COLOR};
  border: 0px;
  border-radius: 4px;
  color: rgb(255, 255, 255);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 8px;
  appearance: none;
`


export default function CustomTooltip(props) {
  const {
    backProps,
    closeProps,
    continuous,
    index,
    primaryProps,
    step,
    tooltipProps
} = props;

  return (
    <TooltipContainer className="tooltip__body" {...tooltipProps}>
      <TooltipClose className="tooltip__close" {...closeProps}>
        &times;
      </TooltipClose>
      <div style={{ lineHeight: '1.4', textAlign: 'center' }}>
        {step.title && <TooltipTitle className="tooltip__title">{step.title}</TooltipTitle>}
        <TooltipContent className="tooltip__content">{step.content}</TooltipContent>
      </div>
      <TooltipFooter className="tooltip__footer">
        <div className="tooltip__spacer">
          {index > 0 && (
            <BackButton className="tooltip__button" {...backProps}>
              {backProps.title}
            </BackButton>
          )}
          {continuous && (
            <PrimaryButton className="tooltip__button tooltip__button--primary" {...primaryProps}>
              {primaryProps.title}
            </PrimaryButton>
          )}
        </div>
      </TooltipFooter>
    </TooltipContainer>
  );
}
