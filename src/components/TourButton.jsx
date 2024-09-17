import styled from 'styled-components';

const StyledButton = styled.button`
    position: absolute;
    top: 240px;
    right: 10px;
    padding: 0.5rem 1rem;
    background-color: #000;
    color: #fff;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    z-index: 50;
`

export default function TourButton({ onClick }) {
    return (
        <StyledButton onClick={onClick}>?</StyledButton>
    );
}