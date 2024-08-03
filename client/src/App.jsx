import React, { useState } from 'react';
import DrawingCanvas from './components/DrawingCanvas';
import {
  Box,
  Button,
  Heading,
  Input,
  VStack,
  Container,
} from '@chakra-ui/react';

function App() {
  const [drawingId, setDrawingId] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  const handleJoinRoom = () => {
    if (drawingId.trim() !== '') {
      setIsJoined(true);
    }
  };

  const handleExitRoom = () => {
    setIsJoined(false);
    setDrawingId('');
  };

  return (
    <Box bg="gray.100" minH="100vh" display="flex" justifyContent="center" alignItems="center">
      <Container centerContent>
        {!isJoined ? (
          <VStack spacing={4} w="full" maxW="md">
            <Heading as="h1" size="2xl" mb={8}>
              /- SketchSync -/
            </Heading>
            <Input
              placeholder="Enter Drawing ID"
              value={drawingId}
              onChange={(e) => setDrawingId(e.target.value)}
              size="lg"
              variant="filled"
              focusBorderColor="blue.500"
            />
            <Button colorScheme="blue" size="lg" onClick={handleJoinRoom} w="full">
              Join Room
            </Button>
          </VStack>
        ) : (
          <>
            <DrawingCanvas drawingId={drawingId} onExitRoom={handleExitRoom} />
          </>
        )}
      </Container>
    </Box>
  );
}

export default App;
