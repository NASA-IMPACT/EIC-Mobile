import styled from 'styled-components';

const StyledButton = styled.button`
    position: absolute;
    height: 32px;
    width: 32px;
    top: 245px;
    right: 15px;
    background-color: #242424;
    color: #adadad;
    border: none;
    cursor: pointer;
    z-index: 50;
`

export default function TourButton({ onClick }) {
    return (
        <StyledButton onClick={onClick}>?</StyledButton>
    );
}