import styled from 'styled-components';

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
`;

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
`;

const TooltipTitle = styled.h1`
    font-weight: bold;
    font-size: 24px;
    margin: 0px;
`;

const TooltipContent = styled.p`
    text-align: left;
    padding: 20px 10px;
`;

const TooltipFooter = styled.div`
    align-items: center;
    display: flex;
    justify-content: space-between;
    margin-top: 15px;
    width: 100%;
`;

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
`;

const PrimaryButton = styled.button`
    background-color: #3661e1;
    border: 0px;
    border-radius: 4px;
    color: rgb(255, 255, 255);
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    padding: 8px;
    appearance: none;
`;

const Spacer = styled.div`
    width: 100%;
    display: flex;
    justify-content: flex-end;
`;

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
            <div style={{ lineHeight: '1.4', textAlign: 'left' }}>
                {step.title && (
                    <TooltipTitle className="tooltip__title">{`${step.title}`}</TooltipTitle>
                )}
                {step.name && (
                    <TooltipTitle className="tooltip__name">{`${step.name}`}</TooltipTitle>
                )}
                <TooltipContent className="tooltip__content">
                    {step.content}
                </TooltipContent>
            </div>
            <TooltipFooter className="tooltip__footer">
                {index > 0 && (
                    <BackButton className="tooltip__button" {...backProps}>
                        {backProps.title}
                    </BackButton>
                )}
                <Spacer className="tooltip__spacer">
                    {continuous && (
                        <PrimaryButton
                            className="tooltip__button tooltip__button--primary"
                            {...primaryProps}
                        >
                            {primaryProps.title === 'Last'
                                ? 'End Tour'
                                : primaryProps.title}
                        </PrimaryButton>
                    )}
                </Spacer>
            </TooltipFooter>
        </TooltipContainer>
    );
}
