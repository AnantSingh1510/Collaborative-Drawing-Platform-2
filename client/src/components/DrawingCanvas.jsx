import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import {
    Box,
    Button,
    Flex,
    Input,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Select,
    useColorModeValue,
    Text,
    VStack,
} from '@chakra-ui/react';

const socket = io('http://localhost:5000');

const DrawingCanvas = ({ drawingId, onExitRoom }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(5);
    const [brushType, setBrushType] = useState('normal');
    const [drawingHistory, setDrawingHistory] = useState([]);
    const [clientCount, setClientCount] = useState(0);
    const [transparency, setTransparency] = useState(1); 
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const resizeCanvas = () => {
            setCanvasDimensions({
                width: canvas.parentElement.clientWidth,
                height: canvas.parentElement.clientHeight,
            });
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        socket.emit('joinDrawing', { drawingId });

        const handleReceiveDrawingData = (data) => {
            const image = new Image();
            image.onload = () => {
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(image, 0, 0);
            };
            image.src = data;
        };

        const handleClearCanvas = () => {
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
        };

        const handleUpdateClientCount = (count) => {
            setClientCount(count);
        };

        socket.on('receiveDrawingData', handleReceiveDrawingData);
        socket.on('clearCanvas', handleClearCanvas);
        socket.on('updateClientCount', handleUpdateClientCount);

        const loadDrawingState = async () => {
            try {
                const res = await axios.get(`http://192.168.1.10:5000/api/drawings/state/${drawingId}`);
                if (res.data) {
                    const image = new Image();
                    image.onload = () => {
                        context.clearRect(0, 0, canvas.width, canvas.height);
                        context.drawImage(image, 0, 0);
                    };
                    image.src = res.data;
                }
            } catch (err) {
                console.error(err);
            }
        };

        loadDrawingState();

        return () => {
            socket.off('receiveDrawingData', handleReceiveDrawingData);
            socket.off('clearCanvas', handleClearCanvas);
            socket.off('updateClientCount', handleUpdateClientCount);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [drawingId]);

    const getMousePosition = (canvas, evt) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;   
        const scaleY = canvas.height / rect.height; 

        return {
            x: (evt.clientX - rect.left) * scaleX,
            y: (evt.clientY - rect.top) * scaleY
        };
    };

    const handleMouseDown = (e) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.beginPath();
        draw(e);
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
        const data = canvasRef.current.toDataURL();
        socket.emit('sendDrawingData', { drawingId, data });
        setDrawingHistory((prev) => [...prev, data]);
    };

    const handleMouseMove = (e) => {
        if (isDrawing) {
            draw(e);
        }
    };

    const drawShape = (context, pos, sides, size) => {
        context.beginPath();
        const angle = (2 * Math.PI) / sides;
        for (let i = 0; i < sides; i++) {
            context.lineTo(
                pos.x + size * Math.cos(i * angle),
                pos.y + size * Math.sin(i * angle)
            );
        }
        context.closePath();
        context.fillStyle = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${transparency})`;
        context.fill();
    };

    const drawStar = (context, pos, points, outerRadius, innerRadius) => {
        context.beginPath();
        const angle = Math.PI / points;
        for (let i = 0; i < 2 * points; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            context.lineTo(
                pos.x + radius * Math.cos(i * angle),
                pos.y + radius * Math.sin(i * angle)
            );
        }
        context.closePath();
        context.fillStyle = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${transparency})`;
        context.fill();
    };

    const draw = (e) => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const pos = getMousePosition(canvas, e);
        context.lineWidth = brushSize;
        context.lineCap = 'round';
        context.strokeStyle = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${transparency})`;

        if (brushType === 'normal') {
            context.lineTo(pos.x, pos.y);
            context.stroke();
            context.beginPath();
            context.moveTo(pos.x, pos.y);
        } else if (brushType === 'dotted') {
            context.beginPath();
            context.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
            context.fillStyle = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${transparency})`;
            context.fill();
            context.closePath();
        } else if (brushType === 'spray') {
            for (let i = 0; i < 10; i++) {
                const offsetX = Math.random() * brushSize - brushSize / 2;
                const offsetY = Math.random() * brushSize - brushSize / 2;
                context.fillStyle = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${transparency})`;
                context.fillRect(pos.x + offsetX, pos.y + offsetY, 1, 1);
            }
        } else if (brushType === 'square') {
            context.fillStyle = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${transparency})`;
            context.fillRect(pos.x - brushSize / 2, pos.y - brushSize / 2, brushSize, brushSize);
        } else if (brushType === 'triangle') {
            drawShape(context, pos, 3, brushSize);
        } else if (brushType === 'star') {
            drawStar(context, pos, 5, brushSize, brushSize / 2);
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        setDrawingHistory([]);
        socket.emit('clearCanvas', drawingId);
    };

    const exitRoom = () => {
        socket.emit('leaveDrawing', { drawingId });
        if (onExitRoom) {
            onExitRoom();
        }
    };

    return (
        <Box p={4}>
            <Flex mb={4} direction={{ base: 'column', md: 'row' }} alignItems="center" justifyContent="space-between">
                <Text fontSize={{ base: 'md', md: 'lg' }}><b>Room no: {drawingId}</b></Text>
                <Text fontSize={{ base: 'md', md: 'lg' }}><b>Clients Connected: {clientCount}</b></Text>
                <Flex direction="column" mr={4}>
                    <Button mb={2}>Color:</Button>
                    <Input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                    />
                </Flex>
                <Flex direction="column" mr={4}>
                    <Button mb={2}>Brush Size:</Button>
                    <Slider
                        aria-label="slider-ex-1"
                        value={brushSize}
                        min={1}
                        max={20}
                        onChange={(val) => setBrushSize(val)}
                    >
                        <SliderTrack>
                            <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                    </Slider>
                </Flex>
                <Flex direction="column" mr={4}>
                    <Button mb={2}>Brush Type:</Button>
                    <Select
                        value={brushType}
                        onChange={(e) => setBrushType(e.target.value)}
                    >
                        <option value="normal">Normal</option>
                        <option value="dotted">Dotted</option>
                        <option value="spray">Spray</option>
                        <option value="square">Square</option>
                        <option value="triangle">Triangle</option>
                        {/* <option value="star">Star</option> */}
                    </Select>
                </Flex>
                <Flex direction="column" mr={4}>
                    <Button mb={2}>Transparency:</Button>
                    <Slider
                        aria-label="slider-ex-2"
                        value={transparency * 100}
                        min={0}
                        max={100}
                        onChange={(val) => setTransparency(val / 100)}
                    >
                        <SliderTrack>
                            <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                    </Slider>
                </Flex>
                <VStack p={0}>
                    <Button color={'red'} onClick={clearCanvas}>Clear Canvas</Button>
                    <Button color={'blue'} onClick={exitRoom}>Exit Room</Button>
                </VStack>
            </Flex>
            <Box
                bg={useColorModeValue('white', 'gray.800')}
                borderWidth="1px"
                borderRadius="lg"
                overflow="hidden"
                width={{ base: '400px', md: '800px', lg: '1600px' }}
                height={{ base: '400px', md: '800px', lg: '800px' }}
                display="flex"
                justifyContent="center"
                alignItems="center"
                p={2}
            >
                <canvas
                    ref={canvasRef}
                    width={canvasDimensions.width}
                    height={canvasDimensions.height}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    style={{ width: '100%', height: '100%' }}
                />
            </Box>
        </Box>
    );
};

export default DrawingCanvas;